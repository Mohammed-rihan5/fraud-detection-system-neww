async function signup() {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;

  const res = await fetch("http://127.0.0.1:5000/signup", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, email })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
  } else {
    alert("Signup successful");
    window.location.href = "login.html";
  }
}