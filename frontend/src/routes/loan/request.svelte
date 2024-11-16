<script>
    import LoanRequestForm from "../../components/LoanRequestForm.svelte";
</script>

<section class="loan-request-container">
    <h1>Request a Loan</h1>
    <LoanRequestForm />
</section>

<style>
    .loan-request-container {
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        text-align: center;
        background-color: #FFFFFF;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    h1 {
        color: #000000;
    }
</style>
