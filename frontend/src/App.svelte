<script>
  import Home from './routes/index.svelte';
  import Wallet from './routes/wallet/index.svelte';
  import WalletCreate from './routes/wallet/create.svelte';
  import { Router, Route } from 'svelte-routing';
</script>

<svelte:head>
  <title>Ezy Loan</title>
  <meta name="description" content="Ezy loan provides loan." />
</svelte:head>

<Router>
  <Route path="/" component={Home} />
  <Route path="/wallet" component={Wallet} />
  <Route path="/wallet/create" component={WalletCreate} />
</Router>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }
</style>
