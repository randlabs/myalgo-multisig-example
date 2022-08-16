## MyAlgo Multisig

The multisig dispatcher backend consists in two services:
 * The backend: exposes an API through which receives transaction signatures, validates them, and stores them in a database
 * The processor: periodically queries the database for transactions in ready state (i.e. all required signatures are gathered) and sends them to the network, completing the flow. This check is executed every 4 seconds.

The backend API exposes an OpenAPI spec through the `/apispec-json` endpoint (see in the [editor](https://editor.swagger.io/?url=https://dev-multisig.algoexplorer.net/apispec-json))

The possible states for a transaction are the following:
 * `pending`: the transaction was submitted and is pending cosigner signatures
 * `ready`: the transaction has enough signatures to be sent to the network
 * `canceled`: the transaction was found to be outdated (`lastRound < currentRound`)
 * `completed`: the transaction was succesfully sent to the network
 * `error`: an error ocurred when sending the transaction to the network

The process to submit a tx is the following:
1. Sign the transaction with the first cosigner
2. Submit it to the dispatcher backend
3. Wait for cosigner signatures. The transaction status can be retrieved through the `/api/v2/status/<txid>` endpoint. To query pending signature transactions for an account use the `/api/v2/pending/<cosigner address>` endpoint.
4. Once there are enough signatures to satisfy the threshold, the processor will automatically dispatch the transaction to the network. If done succesfully, the transactions is marked as `completed`; else, it is marked as `error` and the failure reason is stored in the `error` field.


### Running the example

The example script `index.ts` contains an example of a 2-of-3 multisig. To execute it, first make sure dependencies are installed, and then `npm run start`.
