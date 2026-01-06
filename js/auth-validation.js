async function loginUser(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    const response = await fetch("login.php", {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    if (data.status === "error") {
        alert(data.message);
        return;
    }

    // Login success
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "index.html";
}
