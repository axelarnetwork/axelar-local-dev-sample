const { ethers } = require('ethers');
const { createAndExport } = require('@axelar-network/axelar-local-dev');
const { enabledAptos, enabledSui } = require('./config');
const dns = require('dns');
const path = require('path');
const { EvmRelayer } = require('@axelar-network/axelar-local-dev/dist/relay/EvmRelayer');
const { RelayerType } = require('@axelar-network/axelar-local-dev');

const evmRelayer = new EvmRelayer();

const relayers = { evm: evmRelayer };

/**
 * Start the local chains with Axelar contracts deployed.
 * aUSDC is deployed and funded to the given addresses.
 * @param {*} fundAddresses - addresses to fund with aUSDC
 * @param {*} chains - chains to start. All chains are started if not specified (Avalanche, Moonbeam, Polygon, Fantom, Ethereum).
 */
async function start(fundAddresses = [], chains = [], options = {}) {
    // Set default DNS lookup order to ipv4 first to resolve this issue https://github.com/node-fetch/node-fetch/issues/1624
    dns.setDefaultResultOrder('ipv4first');

    if (enabledAptos) {
        const { AptosRelayer, createAptosNetwork } = require('@axelar-network/axelar-local-dev-aptos');
        await initAptos(createAptosNetwork);
        relayers.aptos = new AptosRelayer();
        evmRelayer.setRelayer('aptos', relayers.aptos);
    }

    if (enabledSui) {
        const { initSui } = require('@axelar-network/axelar-local-dev-sui');
        const { suiRelayer } = await initSui(process.env.SUI_URL, process.env.SUI_FAUCET_URL);
        relayers.sui = suiRelayer;
        evmRelayer.setRelayer(RelayerType.Sui, suiRelayer);
    }

    const pathname = path.resolve(__dirname, '../..', 'chain-config', 'local.json');

    await createAndExport({
        chainOutputPath: pathname,
        accountsToFund: fundAddresses,
        callback: (chain, _info) => deployAndFundUsdc(chain, fundAddresses),
        chains: chains.length !== 0 ? chains : null,
        relayers,
        relayInterval: options.relayInterval,
    });
}

/**
 * Deploy aUSDC and fund the given addresses with 1e12 aUSDC.
 * @param {*} chain - chain to deploy aUSDC on
 * @param {*} toFund - addresses to fund with aUSDC
 */
async function deployAndFundUsdc(chain, toFund) {
    await chain.deployToken('Axelar Wrapped aUSDC', 'aUSDC', 6, ethers.utils.parseEther('1000'));

    for (const address of toFund) {
        await chain.giveToken(address, 'aUSDC', ethers.utils.parseEther('1'));
    }
}

/**
 * Initialize aptos if it is running.
 * If aptos is not running, skip initialization and print a message.
 */
async function initAptos(createAptosNetwork) {
    try {
        await createAptosNetwork({
            nodeUrl: 'http://0.0.0.0:8080',
            faucetUrl: 'http://0.0.0.0:8081',
        });
    } catch (e) {
        console.log('Skip Aptos initialization, rerun this after starting an aptos node for proper support.');
    }
}

module.exports = {
    start,
    evmRelayer,
    relayers,
};
