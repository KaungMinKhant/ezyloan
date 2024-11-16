<script>
    export let wallet = {};
</script>

<div class="card">
    <header class="card-header">
        <h3>Wallet Details</h3>
    </header>
    <section class="card-body">
        <p><strong>Wallet ID:</strong> {wallet.id}</p>
        <p>
            <strong>Balance:</strong>
            {#if wallet.balance.eth}{wallet.balance.eth} ETH{:else}N/A{/if}
        </p>
        <p><strong>Network:</strong> {wallet.network_id}</p>
        <p><strong>Address:</strong> {wallet.default_address.address_id}</p>
    </section>
</div>

<style>
    .card {
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background-color: white;
        text-align: left;
    }

    .card-header {
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;
        margin-bottom: 10px;
    }

    .card-body p {
        margin: 5px 0;
        line-height: 1.5;
    }
</style>
