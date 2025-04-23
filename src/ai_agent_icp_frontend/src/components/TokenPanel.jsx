import { useState, useEffect } from 'react';
import { ai_agent_icp_backend } from '../../../declarations/ai_agent_icp_backend';
import { Principal } from '@dfinity/principal';

function TokenPanel() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Debug available functions
    useEffect(() => {
        console.log("Backend canister object:", ai_agent_icp_backend);
        console.log("Available methods:", Object.keys(ai_agent_icp_backend));
    }, []);

    // Token creation form state
    const [tokenForm, setTokenForm] = useState({
        name: '',
        symbol: '',
        decimals: 8,
        description: '',
        initialSupply: '10000000000000', // 100,000 tokens with 8 decimals
        fee: '10000' // 0.0001 tokens with 8 decimals
    });

    // Token transfer form state
    const [transferForm, setTransferForm] = useState({
        recipient: '',
        amount: '',
        memo: ''
    });

    // Token info
    const [tokenInfo, setTokenInfo] = useState({
        initialized: false,
        name: '',
        symbol: '',
        decimals: 0,
        totalSupply: '',
        fee: ''
    });

    // User account info
    const [account, setAccount] = useState({
        principal: '',
        balance: '0'
    });

    // Load token info on component mount
    useEffect(() => {
        checkTokenStatus();
    }, []);

    const checkTokenStatus = async () => {
        try {
            setLoading(true);
            setError(null);

            // Try to get the token name to check if it's initialized
            const name = await ai_agent_icp_backend.icrc1_name();

            // If we get here, token is initialized
            const [symbol, decimals, totalSupply, fee] = await Promise.all([
                ai_agent_icp_backend.icrc1_symbol(),
                ai_agent_icp_backend.icrc1_decimals(),
                ai_agent_icp_backend.icrc1_total_supply(),
                ai_agent_icp_backend.icrc1_fee()
            ]);

            setTokenInfo({
                initialized: true,
                name,
                symbol,
                decimals,
                totalSupply: totalSupply.toString(),
                fee: fee.toString()
            });

            // Try to get caller principal
            try {
                const principal = await getPrincipal();
                if (principal) {
                    setAccount({
                        ...account,
                        principal: principal.toString()
                    });
                    // Get balance for this principal
                    await getBalance(principal);
                }
            } catch (err) {
                console.error("Could not get principal:", err);
            }
        } catch (err) {
            console.log("Token not initialized yet:", err);
            setTokenInfo({
                ...tokenInfo,
                initialized: false
            });
        } finally {
            setLoading(false);
        }
    };

    const getPrincipal = async () => {
        // This is a workaround to get the user's principal
        // In a real app, you would use authentication
        return Principal.fromText('2vxsx-fae'); // Anonymous principal
    };

    const getBalance = async (principal) => {
        try {
            const account = {
                owner: principal,
                subaccount: []
            };

            const balance = await ai_agent_icp_backend.icrc1_balance_of(account);
            setAccount({
                ...account,
                balance: balance.toString()
            });
        } catch (err) {
            console.error("Could not get balance:", err);
        }
    };

    const handleTokenFormChange = (e) => {
        const { name, value } = e.target;
        setTokenForm({
            ...tokenForm,
            [name]: value
        });
    };

    const handleTransferFormChange = (e) => {
        const { name, value } = e.target;
        setTransferForm({
            ...transferForm,
            [name]: value
        });
    };

    const initializeToken = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);

            const result = await ai_agent_icp_backend.icrc1_init(
                tokenForm.name,
                tokenForm.symbol,
                Number(tokenForm.decimals),
                [tokenForm.description], // Opt<String>
                [], // No logo
                BigInt(tokenForm.initialSupply),
                BigInt(tokenForm.fee)
            );

            if (result) {
                setSuccessMessage(`Token "${tokenForm.name}" (${tokenForm.symbol}) created successfully!`);
                // Clear success message after 5 seconds
                setTimeout(() => setSuccessMessage(''), 5000);

                // Reset form and refresh token info
                setTokenForm({
                    name: '',
                    symbol: '',
                    decimals: 8,
                    description: '',
                    initialSupply: '10000000000000',
                    fee: '10000'
                });

                await checkTokenStatus();
            } else {
                setError("Failed to initialize token");
            }
        } catch (err) {
            setError(`Failed to initialize token: ${err.message || err.toString()}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const transferTokens = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);

            // Parse and validate recipient principal
            let recipientPrincipal;
            try {
                recipientPrincipal = Principal.fromText(transferForm.recipient);
            } catch (err) {
                throw new Error("Invalid recipient principal");
            }

            // Create transfer arguments
            const transferArgs = {
                from_subaccount: [],
                to: {
                    owner: recipientPrincipal,
                    subaccount: []
                },
                amount: BigInt(transferForm.amount),
                fee: [BigInt(tokenInfo.fee)],
                memo: transferForm.memo ? [Array.from(new TextEncoder().encode(transferForm.memo))] : [],
                created_at_time: [BigInt(Math.floor(Date.now() / 1000))]
            };

            // Execute transfer
            const result = await ai_agent_icp_backend.icrc1_transfer(transferArgs);

            if ('Ok' in result) {
                setSuccessMessage(`Transfer successful! Transaction ID: ${result.Ok}`);
                // Clear success message after 5 seconds
                setTimeout(() => setSuccessMessage(''), 5000);

                // Reset form
                setTransferForm({
                    recipient: '',
                    amount: '',
                    memo: ''
                });

                // Refresh account balance
                const principal = await getPrincipal();
                if (principal) {
                    await getBalance(principal);
                }
            } else if ('Err' in result) {
                setError(`Transfer failed: ${JSON.stringify(result.Err)}`);
            }
        } catch (err) {
            setError(`Transfer failed: ${err.message || err.toString()}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatTokenAmount = (amount, decimals) => {
        if (!amount) return '0';

        // Convert to string and pad with leading zeros if needed
        let amountStr = amount.toString();
        let paddedAmount = amountStr.padStart(decimals + 1, '0');

        // Split into integer and fractional parts
        let integerPart = paddedAmount.slice(0, -decimals) || '0';
        let fractionalPart = paddedAmount.slice(-decimals);

        // Remove trailing zeros from fractional part
        fractionalPart = fractionalPart.replace(/0+$/, '');

        // Return formatted amount
        return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
    };

    return (
        <div className="token-panel">
            <h1>ICRC-1 Token Management</h1>

            {error && <div className="error">{error}</div>}
            {successMessage && <div className="success">{successMessage}</div>}
            {loading && <div className="loading">Loading...</div>}

            {!tokenInfo.initialized ? (
                <div className="token-creation">
                    <h2>Create New Token</h2>
                    <form onSubmit={initializeToken}>
                        <div>
                            <label htmlFor="name">Token Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={tokenForm.name}
                                onChange={handleTokenFormChange}
                                placeholder="My Token"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="symbol">Token Symbol:</label>
                            <input
                                type="text"
                                id="symbol"
                                name="symbol"
                                value={tokenForm.symbol}
                                onChange={handleTokenFormChange}
                                placeholder="TKN"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="decimals">Decimals:</label>
                            <input
                                type="number"
                                id="decimals"
                                name="decimals"
                                value={tokenForm.decimals}
                                onChange={handleTokenFormChange}
                                min="0"
                                max="18"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description">Description:</label>
                            <textarea
                                id="description"
                                name="description"
                                value={tokenForm.description}
                                onChange={handleTokenFormChange}
                                placeholder="A description of your token"
                            />
                        </div>

                        <div>
                            <label htmlFor="initialSupply">Initial Supply:</label>
                            <input
                                type="text"
                                id="initialSupply"
                                name="initialSupply"
                                value={tokenForm.initialSupply}
                                onChange={handleTokenFormChange}
                                placeholder="10000000000000"
                                required
                            />
                            <small>Enter the raw amount (10000000000000 = 100,000 tokens with 8 decimals)</small>
                        </div>

                        <div>
                            <label htmlFor="fee">Transfer Fee:</label>
                            <input
                                type="text"
                                id="fee"
                                name="fee"
                                value={tokenForm.fee}
                                onChange={handleTokenFormChange}
                                placeholder="10000"
                                required
                            />
                            <small>Enter the raw amount (10000 = 0.0001 tokens with 8 decimals)</small>
                        </div>

                        <button type="submit" disabled={loading}>Create Token</button>
                    </form>
                </div>
            ) : (
                <div className="token-operations">
                    <div className="token-info">
                        <h2>Token Information</h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td><strong>Name:</strong></td>
                                    <td>{tokenInfo.name}</td>
                                </tr>
                                <tr>
                                    <td><strong>Symbol:</strong></td>
                                    <td>{tokenInfo.symbol}</td>
                                </tr>
                                <tr>
                                    <td><strong>Decimals:</strong></td>
                                    <td>{tokenInfo.decimals}</td>
                                </tr>
                                <tr>
                                    <td><strong>Total Supply:</strong></td>
                                    <td>{formatTokenAmount(tokenInfo.totalSupply, tokenInfo.decimals)} {tokenInfo.symbol}</td>
                                </tr>
                                <tr>
                                    <td><strong>Transfer Fee:</strong></td>
                                    <td>{formatTokenAmount(tokenInfo.fee, tokenInfo.decimals)} {tokenInfo.symbol}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="account-info">
                        <h2>Your Account</h2>
                        <p><strong>Principal:</strong> {account.principal}</p>
                        <p><strong>Balance:</strong> {formatTokenAmount(account.balance, tokenInfo.decimals)} {tokenInfo.symbol}</p>
                        <button onClick={checkTokenStatus}>Refresh</button>
                    </div>

                    <div className="token-transfer">
                        <h2>Transfer Tokens</h2>
                        <form onSubmit={transferTokens}>
                            <div>
                                <label htmlFor="recipient">Recipient Principal:</label>
                                <input
                                    type="text"
                                    id="recipient"
                                    name="recipient"
                                    value={transferForm.recipient}
                                    onChange={handleTransferFormChange}
                                    placeholder="aaaaa-bbbbb-ccccc"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="amount">Amount (raw):</label>
                                <input
                                    type="text"
                                    id="amount"
                                    name="amount"
                                    value={transferForm.amount}
                                    onChange={handleTransferFormChange}
                                    placeholder="100000000"
                                    required
                                />
                                <small>Enter the raw amount (100000000 = 1 token with 8 decimals)</small>
                            </div>

                            <div>
                                <label htmlFor="memo">Memo (Optional):</label>
                                <input
                                    type="text"
                                    id="memo"
                                    name="memo"
                                    value={transferForm.memo}
                                    onChange={handleTransferFormChange}
                                    placeholder="Payment for services"
                                />
                            </div>

                            <button type="submit" disabled={loading}>Transfer</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TokenPanel; 