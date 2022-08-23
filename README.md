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
3. Wait for cosigner signatures. The transaction status can be retrieved through the `/api/v2/status/<txid>` endpoint. To query pending signature transactions for an account use the `/api/v2/pending/<cosigner address>` endpoint. Wallets can periodically poll through these methods to display the transactions status or notify users of transactions they still need to sign.
4. Once there are enough signatures to satisfy the threshold, the processor will automatically dispatch the transaction to the network. If done succesfully, the transactions is marked as `completed`; else, it is marked as `error` and the failure reason is stored in the `error` field.

### Endpoint parameters

#### Pending

 * `all`: boolean. Include transactions in ready state. Ignores those marked as non broadcastable.
 * `sender`: string. Look only for transactions sent by this address

#### Status

 * `signaturesToken`: string. Includes the cosigner signatures in the response, only if it matches the token the tx was submitted with. If no token was submitted with the transaction, cosigner signatures will always be included in the response.

#### Pending

 * `all`: boolean. Include transactions in ready state. Ignores those marked as non broadcastable.
 * `sender`: string. Look only for transactions sent by this address

#### Submit

The following are optional parameters for the submit endpoint:
 * `shouldBroadcast`: boolean. Indicates whether the transaction should be broadcasted to the network. Those transactions marked with `shouldBroadcast: false` won't be picked up by the processor. Default: `true`
 * `signaturesToken`: string. If the value is set, cosigner's signatures will be omitted from the `status` response, unless the same token is set as a parameter.

### Running the example

The example script `index.ts` contains an example of a 2-of-3 multisig. To execute it, first `npm install`, then `npm run start`.
