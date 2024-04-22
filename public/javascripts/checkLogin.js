window.onload = async function() {
    const response = await fetch('/api/checkSession', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const data = await response.json()
    if (!data.success === true) {
        window.location.href = '/login'
    }
}