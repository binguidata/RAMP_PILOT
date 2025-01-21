export function fetchGet(endpoint, params, callback) {
    fetch(localStorage.getItem('host') + endpoint + '?' + new URLSearchParams(params),
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "JWT " + localStorage.getItem("access")
            }})
        .then(response => response.json())
        .then(data => {
            callback(data)
        })
}

export function fetchPost(endpoint, params, callback) {
    fetch(localStorage.getItem('host') + endpoint,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "JWT " + localStorage.getItem("access")
            },
            body: JSON.stringify(params)
        })
        .then(response => response.json())
        .then(data => {
            callback(data)
        })
}

export function fetchPut(endpoint, params, callback) {
    fetch(localStorage.getItem('host') + endpoint,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "JWT " + localStorage.getItem("access")
            },
            body: JSON.stringify(params)
        })
        .then(response => response.json())
        .then(data => {
            callback(data)
        })
}

export function fetchDelete(endpoint, callback) {
    fetch(localStorage.getItem('host') + endpoint, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "JWT " + localStorage.getItem("access")
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data && Object.keys(data).length === 0 && data.constructor === Object) {
        } else {
        }
        if (callback) {
            callback(data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
