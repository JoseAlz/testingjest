<script>
    import { caesar } from '../../scripts/tests.js'; 
    let caesarMessage = '¡Me encanta programar! un poco...';
	let caesarKey = 13;
	$: caesarCiphered = caesar(caesarMessage, caesarKey);
</script>

<h3>Caesar Cipher Encryption</h3>
<div id="caesar">
    <div>
        <label for="key">Clave para cambiar el cifrado: </label>
        <input type="number" name="key" bind:value={caesarKey}>
    </div>
    <div>
        <label for="messageToEncrypt">Cadena para cifrar: </label>
        <input type="text" name="messageToEncrypt" bind:value={caesarMessage}>
    </div>
    <p>Salidas: {caesarCiphered}</p>
</div>

<style>
    #caesar {
        display: flex;
        flex-flow: column nowrap;
        justify-content: space-evenly;
        align-items: flex-start;
        height: 20rem;
    }
</style>
