window.onload = function() {
    document.getElementById('loginBtn').addEventListener('click', async function(event) {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email === '' || password === '') {
            document.getElementById('error').innerText = 'Please fill in all fields';
            return;
        }
        if (!checkEmail(email)) {
            return;
        }
        // Proceed with fetch if validations pass
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password })
        });
        const data = await response.json();
        if (data.success === 'true') {
            window.location.href = '/home';
        } else {
            document.getElementById('error').innerText = data.message;
            console.log(data.message);
        }
    });
}

function checkEmail(email) {
    if (!email.includes('@') || !email.includes('.') || email.length < 5) {
        document.getElementById('error').innerText = 'Invalid email';
        return false;
    }
    return true;
}
window.onload = function() {
    document.getElementById('loginBtn').addEventListener('click', async function(event) {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email === '' || password === '') {
            document.getElementById('error').innerText = 'Please fill in all fields';
            return;
        }
        if (!checkEmail(email)) {
            return;
        }
        // Proceed with fetch if validations pass
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password })
        });
        const data = await response.json();
        if (data.success === true) {
            window.location.href = '/';
        } else {
            document.getElementById('error').innerText = data.message;
        }
    });
}

function checkEmail(email) {
    if (!email.includes('@') || !email.includes('.') || email.length < 5) {
        document.getElementById('error').innerText = 'Invalid email';
        return false;
    }
    return true;
}
