<script>
    export let onCreateWallet;
    let loading = false;

    async function handleCreateWallet() {
        loading = true;
        await onCreateWallet();
        loading = false;
    }
</script>

<div class="wallet-form">
    <button
        class="btn"
        on:click={handleCreateWallet}
        disabled={loading}
    >
        {loading ? "Creating Wallet..." : "Create Wallet"}
    </button>
</div>

<style>
    .wallet-form {
        display: flex;
        justify-content: center;
        margin: 20px 0;
    }

    .btn {
        padding: 12px 24px;
        background-color: #3498db;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .btn:hover {
        background-color: #2980b9;
    }

    .btn:disabled {
        background-color: #bdc3c7;
        cursor: not-allowed;
    }
</style>
