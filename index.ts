import algosdk from 'algosdk';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://dev-multisig.algoexplorer.net'

async function submit(txs: string) {
	const res = await axios.post(`${BACKEND_URL}/api/v2/submit`, {
		txs
	})
	return res.data
}

async function status(txid: string) {
	const res = await axios.get(`${BACKEND_URL}/api/v2/status/${txid}`)
	return res.data
}

async function pending(cosigner: string) {
	const res = await axios.get(`${BACKEND_URL}/api/v2/pending/${cosigner}`)
	return res.data
}

async function main() {
	const account1 = algosdk.generateAccount()
	const account2 = algosdk.generateAccount()
	const account3 = algosdk.generateAccount()

	const msig: algosdk.MultisigMetadata = {
		version: 1,
		threshold: 2,
		addrs: [
			account1.addr,
			account2.addr,
			account3.addr
		]
	}
	const multisig = algosdk.multisigAddress(msig)

	console.log('Addresses')
	console.log('Account 1:', account1.addr)
	console.log('Account 2:', account2.addr)
	console.log('Account 3:', account3.addr)
	console.log('Multisig:', multisig)
	console.log('')

	const algod = new algosdk.Algodv2('', 'https://node.algoexplorerapi.io', '')
	const tx = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
		from: multisig,
		to: account1.addr,
		amount: algosdk.algosToMicroalgos(1),
		suggestedParams: (await algod.getTransactionParams().do())
	})

	// Sign the transaction with the first cosigner and submit it
	const signedByFirst = algosdk.signMultisigTransaction(tx, msig, account1.sk)
	const firstSignatureBlob = Buffer.from(signedByFirst.blob).toString('base64')
	let submitResult = await submit(firstSignatureBlob)
	console.log('Submit first signature result:', submitResult)
	console.log('')

	// Check status after first signature. Status is pending, and the other cosigners
	// have pending transactions
	let txStatus = await status(tx.txID())
	console.log('Status after first signature', txStatus)
	console.log('')
	let pendingTxs = await pending(account2.addr)
	console.log(`Pending txs for account ${account2.addr}`, pendingTxs)
	console.log('')

	// Sign transaction with the second cosigner and submit it
	const signedBySecond = algosdk.signMultisigTransaction(tx, msig, account2.sk)
	const secondSignatureBlob = Buffer.from(signedBySecond.blob).toString('base64')
	submitResult = await submit(secondSignatureBlob)
	console.log('Submit Result:', submitResult)
	console.log('')

	// Check status. Since the multisig is a 2-of-3, enough signatures have been gathered
	// and the transactions is marked as "ready". Notice that no cosigner has pending transactions
	txStatus = await status(tx.txID())
	console.log('Status after second signature', txStatus)
	console.log('')
	pendingTxs = await pending(account2.addr)
	console.log(`Pending txs for account ${account2.addr}`, pendingTxs)
	pendingTxs = await pending(account3.addr)
	console.log(`Pending txs for account ${account3.addr}`, pendingTxs)
	console.log('')

	// Once the processor collects the transaction and sends it to the network
	// it is marked as completed
}

main();
