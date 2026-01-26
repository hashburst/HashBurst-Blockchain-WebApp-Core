import { supabase } from '../lib/supabase';

interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: Record<string, any>;
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws?: string;
  };
}

interface Attestation {
  id: string;
  attestationType: string;
  attestationName: string;
  issuerDid: string;
  issuerName: string;
  attributes: Record<string, any>;
  status: string;
  issuedAt: string;
  expiresAt?: string;
}

interface PresentationRequest {
  walletId: string;
  credentialId: string;
  relyingPartyDid: string;
  relyingPartyName: string;
  requestedAttributes: string[];
}

export class VerifiableCredentialsService {
  static async issueCredential(
    walletId: string,
    credentialType: string,
    issuerDid: string,
    issuerName: string,
    credentialSubject: Record<string, any>,
    expirationDate?: string
  ): Promise<VerifiableCredential> {
    const wallet = await supabase
      .from('eidas_wallets')
      .select('wallet_did')
      .eq('id', walletId)
      .maybeSingle();

    if (!wallet.data) throw new Error('Wallet not found');

    const credentialId = `urn:uuid:${crypto.randomUUID()}`;
    const issuanceDate = new Date().toISOString();

    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1',
      ],
      id: credentialId,
      type: ['VerifiableCredential', credentialType],
      issuer: {
        id: issuerDid,
        name: issuerName,
      },
      issuanceDate,
      expirationDate,
      credentialSubject: {
        id: wallet.data.wallet_did,
        ...credentialSubject,
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: issuanceDate,
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuerDid}#keys-1`,
      },
    };

    const { error } = await supabase.from('verifiable_credentials').insert({
      wallet_id: walletId,
      credential_id: credentialId,
      credential_type: credentialType,
      issuer_did: issuerDid,
      issuer_name: issuerName,
      subject_did: wallet.data.wallet_did,
      credential_data: credential,
      proof: credential.proof,
      issued_at: issuanceDate,
      expires_at: expirationDate,
      status: 'active',
    });

    if (error) throw new Error(`Failed to issue credential: ${error.message}`);

    await this.logCredentialEvent(walletId, 'credential_issued', {
      credentialId,
      credentialType,
      issuer: issuerName,
    });

    return credential;
  }

  static async getCredentials(walletId: string) {
    const { data, error } = await supabase
      .from('verifiable_credentials')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get credentials: ${error.message}`);
    return data || [];
  }

  static async getCredentialById(credentialId: string) {
    const { data, error } = await supabase
      .from('verifiable_credentials')
      .select('*')
      .eq('credential_id', credentialId)
      .maybeSingle();

    if (error) throw new Error(`Failed to get credential: ${error.message}`);
    return data;
  }

  static async revokeCredential(credentialId: string): Promise<void> {
    const { error } = await supabase
      .from('verifiable_credentials')
      .update({ status: 'revoked' })
      .eq('credential_id', credentialId);

    if (error) throw new Error(`Failed to revoke credential: ${error.message}`);
  }

  static async issueAttestation(
    walletId: string,
    attestationType: string,
    attestationName: string,
    issuerDid: string,
    issuerName: string,
    attributes: Record<string, any>,
    selectiveDisclosure: boolean = false,
    expirationDate?: string
  ): Promise<Attestation> {
    const issuedAt = new Date().toISOString();

    const proof = {
      type: selectiveDisclosure ? 'SD-JWT' : 'Ed25519Signature2020',
      created: issuedAt,
      proofPurpose: 'assertionMethod',
      verificationMethod: `${issuerDid}#keys-1`,
    };

    const { data, error } = await supabase
      .from('attestations')
      .insert({
        wallet_id: walletId,
        attestation_type: attestationType,
        attestation_name: attestationName,
        issuer_did: issuerDid,
        issuer_name: issuerName,
        attributes,
        proof,
        selective_disclosure_enabled: selectiveDisclosure,
        issued_at: issuedAt,
        expires_at: expirationDate,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to issue attestation: ${error.message}`);

    await this.logCredentialEvent(walletId, 'attestation_issued', {
      attestationType,
      attestationName,
      issuer: issuerName,
    });

    return {
      id: data.id,
      attestationType: data.attestation_type,
      attestationName: data.attestation_name,
      issuerDid: data.issuer_did,
      issuerName: data.issuer_name,
      attributes: data.attributes,
      status: data.status,
      issuedAt: data.issued_at,
      expiresAt: data.expires_at,
    };
  }

  static async getAttestations(walletId: string) {
    const { data, error } = await supabase
      .from('attestations')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get attestations: ${error.message}`);
    return data || [];
  }

  static async presentCredential(request: PresentationRequest): Promise<string> {
    const credential = await this.getCredentialById(request.credentialId);
    if (!credential) throw new Error('Credential not found');

    const disclosedAttributes: Record<string, any> = {};
    request.requestedAttributes.forEach(attr => {
      if (credential.credential_data.credentialSubject[attr]) {
        disclosedAttributes[attr] = credential.credential_data.credentialSubject[attr];
      }
    });

    const presentation = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: [credential.credential_data],
      holder: credential.subject_did,
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofPurpose: 'authentication',
        verificationMethod: `${credential.subject_did}#keys-1`,
      },
    };

    const presentationToken = btoa(JSON.stringify(presentation));

    const { error } = await supabase.from('credential_presentations').insert({
      wallet_id: request.walletId,
      credential_id: credential.id,
      relying_party_did: request.relyingPartyDid,
      relying_party_name: request.relyingPartyName,
      disclosed_attributes: disclosedAttributes,
      presentation_token: presentationToken,
      verified: true,
    });

    if (error) throw new Error(`Failed to record presentation: ${error.message}`);

    await this.logCredentialEvent(request.walletId, 'credential_presented', {
      credentialId: request.credentialId,
      relyingParty: request.relyingPartyName,
      attributesCount: request.requestedAttributes.length,
    });

    return presentationToken;
  }

  static async getPresentationHistory(walletId: string) {
    const { data, error } = await supabase
      .from('credential_presentations')
      .select('*')
      .eq('wallet_id', walletId)
      .order('presented_at', { ascending: false });

    if (error) throw new Error(`Failed to get presentation history: ${error.message}`);
    return data || [];
  }

  static async verifyPresentation(presentationToken: string): Promise<boolean> {
    try {
      const presentation = JSON.parse(atob(presentationToken));

      if (!presentation['@context'] || !presentation.type) {
        return false;
      }

      if (!presentation.type.includes('VerifiablePresentation')) {
        return false;
      }

      if (!presentation.verifiableCredential || presentation.verifiableCredential.length === 0) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  static async registerTrustedIssuer(
    issuerDid: string,
    issuerName: string,
    issuerCountry: string,
    certificateData: Record<string, any>,
    trustFramework?: string
  ): Promise<void> {
    const { error } = await supabase.from('trusted_issuers').insert({
      issuer_did: issuerDid,
      issuer_name: issuerName,
      issuer_country: issuerCountry,
      certificate_data: certificateData,
      trust_framework: trustFramework,
      status: 'active',
    });

    if (error) throw new Error(`Failed to register trusted issuer: ${error.message}`);
  }

  static async getTrustedIssuers() {
    const { data, error } = await supabase
      .from('trusted_issuers')
      .select('*')
      .eq('status', 'active')
      .order('issuer_name', { ascending: true });

    if (error) throw new Error(`Failed to get trusted issuers: ${error.message}`);
    return data || [];
  }

  static async isIssuerTrusted(issuerDid: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('trusted_issuers')
      .select('id')
      .eq('issuer_did', issuerDid)
      .eq('status', 'active')
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  private static async logCredentialEvent(
    walletId: string,
    operationType: string,
    details: Record<string, any>
  ): Promise<void> {
    await supabase.from('wallet_audit_log').insert({
      wallet_id: walletId,
      operation_type: operationType,
      operation_details: details,
      success: true,
    });
  }
}
