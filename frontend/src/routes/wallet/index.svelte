<script>
    import WalletCard from "../../components/WalletCard.svelte";

    let wallets = [
        {
            balance: { eth: "0.5" },
            can_sign: true,
            default_address: {
                address_id: "0x5eE8A2bBe640486Dc6fAC012D7ad3F0555039235",
                wallet_id: "31ac101e-80aa-4ace-a5b4-339b5143528a",
                network_id: "base-sepolia",
            },
            id: "31ac101e-80aa-4ace-a5b4-339b5143528a",
            network_id: "base-sepolia",
        },
        {
            balance: { eth: "1.2" },
            can_sign: true,
            default_address: {
                address_id: "0x8bE8A2bBe640486Dc6fAC012D7ad3F0555039999",
                wallet_id: "4bc201fe-70aa-4ace-b4c4-556b5243251c",
                network_id: "base-sepolia",
            },
            id: "4bc201fe-70aa-4ace-b4c4-556b5243251c",
            network_id: "base-sepolia",
        },
    ];
</script>

<section class="dashboard">
    <h1>Wallet Dashboard</h1>
    <p>Here you can view all your wallets and their details.</p>
    
    <div class="wallets">
        {#each wallets as wallet}
            <WalletCard {wallet} />
        {/each}
    </div>
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
</style>
