window.onload = async function() {
    const response = await fetch('/api/checkSession', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const data = await response.json()
    if (data[0] === 'true') {
        window.location.href = '/home'
    }

    document.getElementById('signupBtn').addEventListener('click', async function(event) {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if(email === '' || password === '') {
            document.getElementById('error').innerText = 'Please fill in all fields';
            return;
        }
        if (!checkPassword(password) || !checkEmail(email)) {
            return;
        }
        // Proceed with fetch if validations pass
        const response = await fetch('/signup', {
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

function checkPassword(password){
    if (password.length < 6) {
        document.getElementById('error').innerText = 'Password must be at least 6 characters'
        return false;
    }
    else if (password.search(/[a-z]/) === -1) {
        document.getElementById('error').innerText = 'Password must contain at least one lowercase letter'
        return false;
    }
    else if (password.search(/[A-Z]/) === -1) {
        document.getElementById('error').innerText = 'Password must contain at least one uppercase letter'
        return false;
    }
    else if (password.search(/[0-9]/) === -1) {
        document.getElementById('error').innerText = 'Password must contain at least one number'
        return false;
    }
    else if (password.search(/[!@#$%^&*]/) === -1) {
        document.getElementById('error').innerText = 'Password must contain at least one special character'
        return false;
    }
    return true;
}