<template>
  <main>
    <router-view />

    <nav class="bottom-nav">
      <RouterLink to="/">Inicio</RouterLink>
      <RouterLink to="/upload">Subir</RouterLink>
      <RouterLink to="/login">Cuenta</RouterLink>
    </nav>
  </main>
</template>