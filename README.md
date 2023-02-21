# Axelar cross-chain dApp examples

## Introduction

This repo provides the code for several example dApps in the [Axelar Local Development Environment](https://github.com/axelarnetwork/axelar-local-dev). Examples contain both JavaScript and Solidity smart contract code.

**Note:** Some example folders in this repo are not documented.

## One-time setup

Install [nodejs](https://nodejs.org/en/download/). Run `node -v` to check your installation.

Support Node.js version 16.x and 18.x

Clone this repo:

```bash
git clone https://github.com/axelarnetwork/axelar-examples.git
```

## Set up deployer key
You can get started quickly with a random local key and `.env` file by running

```bash
# node scripts/createPrivateKey.js
npm run setup
```

Or you can manually copy the example `.env.example` file and fill in your EVM private key. See the [example Metamask Instructions](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-export-an-account-s-private-key) for exporting your private keys.

```bash
cp .env.example .env
```

Then update to your own private key.

## Print wallet balances

This script will print your wallet balances for each chain.

```bash
npm run check-balance [local|testnet]
```

If not specify, this will print balances of the wallet for testnet.

## Running the local chains

```bash
npm run start
```

Leave this node running on a separate terminal before deploying and testing the dApps.

## Examples

-   [Evm Examples](/examples/evm/)
-   [Aptos Examples](/examples/aptos/)
-   [Web Examples](/examples-web/)
