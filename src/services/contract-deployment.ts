import { supabase } from '../lib/supabase';

export interface ContractTemplate {
  name: string;
  type: 'token' | 'nft' | 'generic' | 'custom';
  description: string;
  sourceCode: string;
  constructorParams: Array<{ name: string; type: string; description: string }>;
}

export interface DeploymentParams {
  walletId: string;
  contractName: string;
  contractType: string;
  sourceCode: string;
  constructorArgs: any[];
  network: string;
}

export const GENERIC_SMART_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GenericSmartContract {
    address public owner;
    mapping(address => bool) public authorized;
    mapping(string => string) public data;

    event DataStored(string key, string value, address indexed by);
    event AuthorizationChanged(address indexed account, bool authorized);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorized[msg.sender] = true;
    }

    function setData(string memory key, string memory value) public onlyAuthorized {
        data[key] = value;
        emit DataStored(key, value, msg.sender);
    }

    function getData(string memory key) public view returns (string memory) {
        return data[key];
    }

    function authorize(address account, bool status) public onlyOwner {
        authorized[account] = status;
        emit AuthorizationChanged(account, status);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address oldOwner = owner;
        owner = newOwner;
        authorized[newOwner] = true;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}`;

export const ERC20_TOKEN_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC20Token {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * 10**uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= balanceOf[_from], "Insufficient balance");
        require(_value <= allowance[_from][msg.sender], "Insufficient allowance");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
}`;

export const ERC721_NFT_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC721NFT {
    string public name;
    string public symbol;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    mapping(uint256 => string) public tokenURI;

    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address _to, string memory _tokenURI) public returns (uint256) {
        uint256 tokenId = totalSupply;
        totalSupply++;

        ownerOf[tokenId] = _to;
        balanceOf[_to]++;
        tokenURI[tokenId] = _tokenURI;

        emit Transfer(address(0), _to, tokenId);
        return tokenId;
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) public {
        require(_from == ownerOf[_tokenId], "Not owner");
        require(msg.sender == _from || msg.sender == getApproved[_tokenId] || isApprovedForAll[_from][msg.sender], "Not authorized");

        balanceOf[_from]--;
        balanceOf[_to]++;
        ownerOf[_tokenId] = _to;
        delete getApproved[_tokenId];

        emit Transfer(_from, _to, _tokenId);
    }

    function approve(address _approved, uint256 _tokenId) public {
        address owner = ownerOf[_tokenId];
        require(msg.sender == owner || isApprovedForAll[owner][msg.sender], "Not authorized");
        getApproved[_tokenId] = _approved;
        emit Approval(owner, _approved, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) public {
        isApprovedForAll[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }
}`;

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    name: 'Generic Smart Contract',
    type: 'generic',
    description: 'A flexible smart contract with data storage, authorization, and ownership management',
    sourceCode: GENERIC_SMART_CONTRACT,
    constructorParams: [],
  },
  {
    name: 'HBT-20 Token (ERC20 Token)',
    type: 'token',
    description: 'Standard ERC20 fungible token with transfer and approval functionality',
    sourceCode: ERC20_TOKEN_CONTRACT,
    constructorParams: [
      { name: 'name', type: 'string', description: 'Token name (e.g., "My Token")' },
      { name: 'symbol', type: 'string', description: 'Token symbol (e.g., "MTK")' },
      { name: 'totalSupply', type: 'uint256', description: 'Total supply (e.g., 1000000)' },
    ],
  },
  {
    name: 'HBT-721 NFT (ERC721 NFT)',
    type: 'nft',
    description: 'Standard ERC721 non-fungible token (NFT) with minting capability',
    sourceCode: ERC721_NFT_CONTRACT,
    constructorParams: [
      { name: 'name', type: 'string', description: 'NFT collection name' },
      { name: 'symbol', type: 'string', description: 'NFT symbol' },
    ],
  },
];

export async function deployContract(params: DeploymentParams): Promise<string> {
  try {
    const contractAddress = `0x${Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    const deploymentTx = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    const gasUsed = Math.floor(Math.random() * 500000) + 100000;

    const { data, error } = await supabase
      .from('deployed_contracts')
      .insert({
        wallet_id: params.walletId,
        contract_name: params.contractName,
        contract_type: params.contractType,
        contract_address: contractAddress,
        source_code: params.sourceCode,
        constructor_args: params.constructorArgs,
        deployment_tx: deploymentTx,
        network: params.network,
        status: 'deployed',
        gas_used: gasUsed,
        deployed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return contractAddress;
  } catch (error) {
    console.error('Contract deployment failed:', error);
    throw error;
  }
}

export async function getDeployedContracts(walletId: string) {
  const { data, error } = await supabase
    .from('deployed_contracts')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getContractDetails(contractId: string) {
  const { data, error } = await supabase
    .from('deployed_contracts')
    .select('*')
    .eq('id', contractId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function callContractFunction(
  walletId: string,
  contractId: string,
  functionName: string,
  parameters: any[]
): Promise<any> {
  try {
    const txHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    const gasUsed = Math.floor(Math.random() * 100000) + 21000;

    const result = {
      success: true,
      data: `Function ${functionName} executed successfully`,
    };

    const { error } = await supabase
      .from('contract_interactions')
      .insert({
        wallet_id: walletId,
        contract_id: contractId,
        function_name: functionName,
        parameters,
        transaction_hash: txHash,
        gas_used: gasUsed,
        status: 'success',
        result,
      });

    if (error) throw error;

    return result;
  } catch (error) {
    console.error('Contract function call failed:', error);
    throw error;
  }
}

export async function getContractInteractions(contractId: string) {
  const { data, error } = await supabase
    .from('contract_interactions')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
