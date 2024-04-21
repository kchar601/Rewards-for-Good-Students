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
    else {
        window.location.href = '/login'
    }
}