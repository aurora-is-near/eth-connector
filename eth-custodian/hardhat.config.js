/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('dotenv').config();
require('@nomiclabs/hardhat-waffle');
require('hardhat-gas-reporter');

const WEB3_RPC_ENDPOINT = process.env.WEB3_RPC_ENDPOINT;
const ROPSTEN_PRIVATE_KEY = process.env.ROPSTEN_PRIVATE_KEY;

task('eth-deposit-to-near', 'Deposits the provided `amount` (wei) having `fee`(wei) to ETH Custodian to transfer it to Near')
    .addParam('nearRecipient', 'AccountID of recipient on Near')
    .addParam('amount', 'Amount (wei) to transfer', 0, types.int)
    .addParam('fee', 'Fee (wei) for the transfer', 0, types.int)
    .setAction(async taskArgs => {
        if (taskArgs.amount <= 0 || taskArgs.fee > taskArgs.amount) {
            throw new Error(
                'The amount to transfer should be greater than 0 and bigger than fee'
            );
        }
        const { ethDeposit } = require('./scripts/eth_deposit');
        const depositToNear = true;
        await ethDeposit(hre.ethers.provider, depositToNear, taskArgs.nearRecipient, taskArgs.amount, taskArgs.fee);
    });

task('eth-deposit-to-evm', 'Deposits the provided `amount` (wei) having `fee`(wei) to ETH Custodian to transfer it to Near EVM')
    .addParam('ethRecipientOnNear', 'AccountID of recipient on Near')
    .addParam('amount', 'Amount (wei) to transfer', 0, types.int)
    .addParam('fee', 'Fee (wei) for the transfer', 0, types.int)
    .setAction(async taskArgs => {
        if (taskArgs.amount <= 0 || taskArgs.fee > taskArgs.amount) {
            throw new Error(
                'The amount to transfer should be greater than 0 and bigger than fee'
            );
        }
        const { ethDeposit } = require('./scripts/eth_deposit');
        const depositToNear = false;
        await ethDeposit(hre.ethers.provider, depositToNear, taskArgs.ethRecipientOnNear, taskArgs.amount, taskArgs.fee);
    });

task('eth-generate-deposit-proof', 'Generates deposit proof for the given TX hash')
    .addParam('txHash', 'transaction hash')
    .setAction(async taskArgs => {
        const Proof = require('./scripts/eth_generate_proof');
        await Proof.findProof(taskArgs.txHash);
    });

task('near-finalise-deposit-from-eth', 'Generates the deposit proof for the given Ethereum TX hash and submits it to Near to finalise the deposit')
    .addParam('txHash', 'transaction hash')
    .addParam('nearAccount', 'Near account that will submit the deposit transaction to Near')
    .addOptionalParam('depositedToNear', 'Set this if you are depositing to Near NEP-14. Used only for balance information (default: false)', false, types.boolean)
    .addOptionalParam('nearRecipient', 'Near account that will receive the transferred amount (Used for verbose purposes to get detailed information)', undefined)
    .addOptionalParam('ethRecipient', 'Aurora ETH account that will receive the transferred amount (Used for verbose purposes to get detailed information)', undefined)
    .addOptionalParam('nearJsonRpc', 'Near JSON RPC address (default: "https://rpc.testnet.near.org/"', 'https://rpc.testnet.near.org/')
    .addOptionalParam('nearNetwork', 'Near network (default: default)', 'default')
    .setAction(async taskArgs => {
        const { nearFinaliseDepositFromEth } = require('./scripts/near_finalise_deposit_from_eth');
        await nearFinaliseDepositFromEth(taskArgs.nearAccount, taskArgs.nearJsonRpc, taskArgs.nearNetwork, taskArgs.depositedToNear, taskArgs.txHash, taskArgs.nearRecipient, taskArgs.ethRecipient);
    });

task('near-withdraw-bridged-eth', 'Withdraws the provided `amount` (bridgedWei) having `fee` (bridgedWei) from `nearAccount` to `ethRecipient` to transfer it to Ethereum')
    .addParam('nearAccount', 'Near account to withdraw from')
    .addParam('ethRecipient', 'Address of the recipient on Ethereum')
    .addParam('amount', 'Amount (bridgedWei) to withdraw', 0, types.int)
    .addParam('fee', 'Fee (bridgedWei) for the withdraw', 0, types.int)
    //.addOptionalParam('noStd', 'Set this if you are using no-std version of the connector (default: false)', false, types.boolean)
    .addOptionalParam('nearJsonRpc', 'Near JSON RPC address (default: "https://rpc.testnet.near.org/"', 'https://rpc.testnet.near.org/')
    .addOptionalParam('nearNetwork', 'Near network (default: default)', 'default')
    .setAction(async taskArgs => {
        if (taskArgs.amount <= 0 || taskArgs.fee > taskArgs.amount) {
            throw new Error(
                'The amount to transfer should be greater than 0 and bigger than fee'
            );
        }
        const { nearWithdrawBridgedEth } = require('./scripts/near_withdraw_to_eth');
        await nearWithdrawBridgedEth(taskArgs.nearAccount, taskArgs.nearJsonRpc, taskArgs.nearNetwork, taskArgs.ethRecipient, taskArgs.amount, taskArgs.fee);
    });

task('eth-finalise-withdraw-from-near', 'Generates the receipt proof for the given Near TX hash and submits it to Ethereum to finalise the withdraw')
    .addParam('receiptId', 'Withdrawal success receipt ID')
    .addParam('nearAccount', 'Near account that will relay the transaction')
    .addOptionalParam('nearJsonRpc', 'Near JSON RPC address (default: "https://rpc.testnet.near.org/"', 'https://rpc.testnet.near.org/')
    .addOptionalParam('nearNetwork', 'Near network (default: default)', 'default')
    .setAction(async taskArgs => {
        const { ethFinaliseWithdrawFromNear } = require('./scripts/eth_finalise_withdraw_from_near');
        await ethFinaliseWithdrawFromNear(hre.ethers.provider, taskArgs.nearAccount, taskArgs.nearJsonRpc, taskArgs.nearNetwork, taskArgs.receiptId);
    });

task('near-ft-balance-of', 'Returns the current balance of bridged ETH for the provided Near account')
    .addParam('nearAccount', 'Near account that owns bridged ETH')
    .addOptionalParam('nearJsonRpc', 'Near JSON RPC address (default: "https://rpc.testnet.near.org/"', 'https://rpc.testnet.near.org/')
    .addOptionalParam('nearNetwork', 'Near network (default: default)', 'default')
    .setAction(async taskArgs => {
        const { nearFtBalanceOf } = require('./scripts/near_utils');
        const accountBalance = await nearFtBalanceOf(taskArgs.nearAccount, taskArgs.nearJsonRpc, taskArgs.nearNetwork);
        console.log(`Account balance of ${nearAccount}: ${accountBalance} yoctoNEAR`);
    });

task('near-ft-balance-of-eth', 'Returns the current balance of nETH for the provided Ethereum account')
    .addParam('ethAddress', 'Ethereum address that owns nETH')
    .addParam('nearAccount', 'Near account that creates a request')
    .addOptionalParam('nearJsonRpc', 'Near JSON RPC address (default: "https://rpc.testnet.near.org/"', 'https://rpc.testnet.near.org/')
    .addOptionalParam('nearNetwork', 'Near network (default: default)', 'default')
    .setAction(async taskArgs => {
        const { nearFtBalanceOfEth } = require('./scripts/near_utils');
        const ethBalance = await nearFtBalanceOfEth(taskArgs.nearAccount, taskArgs.nearJsonRpc, taskArgs.nearNetwork, taskArgs.ethAddress);
        console.log(`Account balance of ${taskArgs.ethAddress}: ${hre.ethers.utils.formatEther(ethBalance)} nETH (${ethBalance} nWei)`);
    });

task('aurora-init-eth-connector', 'Initializes the Eth connector in the Aurora contract')
    .addParam('nearAccount', 'Near account that will submit the deposit transaction to Near')
    .addOptionalParam('nearJsonRpc', 'Near JSON RPC address (default: "https://rpc.testnet.near.org/"', 'https://rpc.testnet.near.org/')
    .addOptionalParam('nearNetwork', 'Near network (default: default)', 'default')
    .setAction(async taskArgs => {
        const { auroraInitEthConnector } = require('./scripts/aurora_init_eth_connector');
        await auroraInitEthConnector(taskArgs.nearAccount, taskArgs.nearJsonRpc, taskArgs.nearNetwork);
    });

module.exports = {
  paths: {
    sources: "./contracts",
    artifacts: "./build",
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    ropsten: {
      url: `${WEB3_RPC_ENDPOINT}`,
      accounts: [`0x${ROPSTEN_PRIVATE_KEY}`]
    }
  },
  gasReporter: {
    currency: 'USD',
    enabled: false
  }
};
