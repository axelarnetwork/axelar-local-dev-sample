// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';

/**
 * @title CallContractGasEstimation
 * @notice Send a message from chain A to chain B and stores gmp message
 */
contract CallContractGasEstimation is AxelarExecutable {
    string public message;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService public immutable gasService;
    uint256 public constant GAS_LIMIT = 200000;

    event Executed(string _from, string _message);

    /**
     *
     * @param _gateway address of axl gateway on deployed chain
     * @param _gasReceiver address of axl gas service on deployed chain
     */
    constructor(address _gateway, address _gasReceiver) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasReceiver);
    }

    /**
     * @notice Estimate gas for a cross-chain contract call
     * @param destinationChain name of the dest chain
     * @param destinationAddress address on dest chain this tx is going to
     * @param _message message to be sent
     * @return gasEstimate The cross-chain gas estimate
     */
    function estimateGasFee(
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata _message
    ) external view returns (uint256) {
        bytes memory payload = abi.encode(_message);

        return gasService.estimateGasFee(
            destinationChain,
            destinationAddress,
            payload,
            GAS_LIMIT,
            new bytes(0)
        );
    }

    /**
     * @notice Send message from chain A to chain B
     * @dev message param is passed in as gmp message
     * @param destinationChain name of the dest chain (ex. "Fantom")
     * @param destinationAddress address on dest chain this tx is going to
     * @param _message message to be sent
     */
    function setRemoteValue(
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata _message
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(_message);
        gasService.payGas{ value: msg.value }(
            address(this),
            destinationChain,
            destinationAddress,
            payload,
            GAS_LIMIT,
            true,
            msg.sender,
            new bytes(0)
        );
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    /**
     * @notice logic to be executed on dest chain
     * @dev this is triggered automatically by relayer
     * @param _sourceChain blockchain where tx is originating from
     * @param _sourceAddress address on src chain where tx is originating from
     * @param _payload encoded gmp message sent from src chain
     */
    function _execute(string calldata _sourceChain, string calldata _sourceAddress, bytes calldata _payload) internal override {
        (message) = abi.decode(_payload, (string));
        sourceChain = _sourceChain;
        sourceAddress = _sourceAddress;

        emit Executed(sourceAddress, message);
    }
}
