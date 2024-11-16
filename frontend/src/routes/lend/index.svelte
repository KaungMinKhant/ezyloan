<script>
    import LenderForm from "../../components/LenderForm.svelte";
</script>

<section class="loan-request-page">
    <h1>Lender Form</h1>
    <p>Provide the details of amount you want to lend and choose your token.</p>
    <LenderForm />
</section>

<style>
    .loan-request-page {
        max-width: 800px;
        margin: auto;
        padding: 20px;
        text-align: center;
        background-color: #FFFFFF;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    h1 {
        color: #000000;
        margin-bottom: 10px;
    }

    p {
        color: #000000;
        margin-bottom: 20px;
    }
</style>
