<script>
  // import Navbar from './components/Navbar.svelte';
  // import Footer from './components/Footer.svelte';
  import Home from './routes/index.svelte';
  import Login from './routes/login/index.svelte';
  import { Router, Route, link, navigate } from 'svelte-routing';
</script>

<svelte:head>
  <title>Ezy Loan</title>
  <meta name="description" content="Ezy loan provides loan." />
</svelte:head>
<!-- <Navbar {isAuthenticated} on:logout={handleLogout} /> -->

<Router>
  <Route path="/" component={Home} />
  <Route path="/login" component={Login} />
</Router>

<!-- <Footer /> -->

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }
</style>
