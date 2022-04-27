<script>
    import { analyzeArray } from '../../scripts/tests.js';
    let arrayToAnalyze = [1,8,3,4,2,6];
    $: newArray = [...arrayToAnalyze];
    $: analyzedObject = analyzeArray(newArray);
    function handleAdd() {
        arrayToAnalyze = [...arrayToAnalyze, 1];
    }
    function handleRemove() {
        arrayToAnalyze.splice(-1, 1);
        arrayToAnalyze = [...arrayToAnalyze];
    }
</script>
<h3>Array Analysis</h3>
<p>Cada entrada de número se agregará a una matriz para ser analizada y los resultados se devolverán a un objeto</p>
<div id="analyze">
    <div id="buttons">
        <button on:click={handleAdd}>Add a number</button>
        <button on:click={handleRemove}>Remove a number</button>
    </div>
    <div id="inputs">
            {#each arrayToAnalyze as i}
                <div>
                    <input type="number" bind:value={i}>
                </div>
            {/each}
    </div>
    <div id="code">
        <pre>
            <code>
                let returnedObject = &lbrace; 
                    average: {analyzedObject.average},
                    min: {analyzedObject.min},
                    max: {analyzedObject.max},
                    length: {analyzedObject.length}
                &rbrace;;
            </code>
        </pre>
    </div>
</div>

<style>
    #analyze {
        display: flex;
        flex-flow: column wrap;
        height: 30rem;
        justify-content: center;
        align-items: center;
    }
    #buttons {
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-evenly;
    }
    #inputs {
        display: flex;
        height: 10rem;
        justify-content: center;
        align-items: center;
    }
    #code > pre > code {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    button {
        width: 12rem;
        border-radius: 8px;
        padding: .666rem .333rem;
        margin-bottom: 2rem;
        background-color: #FD5D5D;
    }
    button:nth-of-type(odd) {
        background-color: #42C2FF;
    }
    input {
        width: 4rem;
        margin: 2% .666rem;
    }
</style>