var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/JoseAlz/stesting.git', // Update to point to your repository  
        user: {
            name: 'JoseAlz', // update to use your name
            email: 'joseufox@hotmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)