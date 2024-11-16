<script>
    import WalletCard from "../../components/WalletCard.svelte";
    import { onMount } from "svelte";
    import { urlRoot } from "../../constants";

    let wallets = [];
    let isLoading = true;
    let errorMessage = "";

    // Fetch wallets from the API
    async function fetchWallets() {
        try {
            const response = await fetch(`${urlRoot}/api/v1/wallets`);
            if (response.ok) {
                wallets = await response.json();
                errorMessage = wallets.length ? "" : "No wallets found.";
            } else {
                errorMessage = "Failed to fetch wallets.";
            }
        } catch (error) {
            console.error("Error fetching wallets:", error);
            errorMessage = "Error fetching wallets. Please check your connection.";
        } finally {
            isLoading = false;
        }
    }

    // Call fetchWallets when the component is mounted
    onMount(() => {
        fetchWallets();
    });
</script>

<section class="dashboard">
    <h1>Wallet Dashboard</h1>
    <p>Here you can view all your wallets and their details.</p>
    
    {#if isLoading}
        <p>Loading wallets...</p>
    {:else if errorMessage}
        <p class="error-text">{errorMessage}</p>
    {:else}
        <div class="wallets">
            {#each wallets as wallet}
                <WalletCard {wallet} />
            {/each}
        </div>
    {/if}
</section>

<style>
    .dashboard {
        max-width: 900px;
        margin: auto;
        padding: 20px;
        text-align: center;
    }

    .wallets {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }

    .error-text {
        color: red;
        font-weight: bold;
    }
</style>
