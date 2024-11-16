<script>
    import WalletCard from "../../components/WalletCard.svelte";
    import WalletForm from "../../components/WalletForm.svelte";
    import { urlRoot } from "../../constants.js";

    let wallet = null;

    async function createWallet() {
        try {
            const response = await fetch(`${urlRoot}/api/v1/wallet/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to create wallet");
            }

            wallet = await response.json();
        } catch (error) {
            console.error("Error creating wallet:", error);
        }
    }
</script>

<section class="create-wallet-container">
    <h1>Create a Wallet</h1>
    <p>Securely create a new wallet to manage your decentralized assets.</p>

    {#if wallet}
        <div class="wallet-display">
            <WalletCard {wallet} />
        </div>
    {:else}
        <div class="wallet-form">
            <WalletForm onCreateWallet={createWallet} />
        </div>
    {/if}
</section>

<style>
    .create-wallet-container {
        max-width: 700px;
        margin: 40px auto;
        padding: 20px;
        text-align: center;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background-color: white;
    }

    h1 {
        font-size: 2rem;
        margin-bottom: 10px;
        color: #333;
    }

    p {
        font-size: 1rem;
        margin-bottom: 20px;
        color: #555;
    }

    .wallet-display,
    .wallet-form {
        margin-top: 20px;
    }
</style>
