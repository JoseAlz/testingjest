<script>
    import { reverseString } from '../../scripts/tests.js';
	let reverseInput = '';
    $: reversed = reverseString(reverseInput);
</script>

<div id="reverse">
    <div>
        <label for="reversingInput">Toma una cadena de texto  y la devuélve al revés: </label>
        <input type="text" name="reversingInput" bind:value={reverseInput}>
    </div>
    <p>Salida: {reversed}</p>
</div>

<style>
    #reverse {
        display: flex;
        flex-flow: column nowrap;
        height: 12rem;
        justify-content: space-evenly;
        align-items: flex-start;
    }
    #reverse > div {
        display: flex;
        flex-flow: row wrap;
    }
</style>