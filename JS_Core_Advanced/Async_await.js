// Напишите функцию fetchUserData,
// которая использует async/await для загрузки данных о пользователе с сервера по его идентификатору.
// Функция должна принимать идентификатор пользователя в качестве аргумента и возвращать объект с данными о пользователе.

async function fetchUserData(userId) {
    const apiUrl = `http://localhost:3000/api/users/${userId}`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        throw error;
    }
}

fetchUserData(2)
    .then(userData => {
        console.log('User Data:', userData);
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
    });