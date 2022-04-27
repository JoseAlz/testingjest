<script>
    import { capFirstString } from '../../scripts/tests.js';
    let capitalize = '';
    $: firstLetter = capFirstString(capitalize);
</script>

<div id="capString">
    <div>
        <label for="cappingFirstLetter">Tome una cadena y devuelva esa cadena con el primer carácter en mayúscula: </label>
        <input type="text" name="cappingFirstLetter" bind:value={capitalize}>
    </div>
    <p>Salida: {firstLetter}</p>
</div>

<style>
    #capString {
        display: flex;
        flex-flow: column nowrap;
        height: 12rem;
        justify-content: space-evenly;
        align-items: flex-start;
    }
    #capString > div {
        display: flex;
        flex-flow: row wrap;
    }
</style>