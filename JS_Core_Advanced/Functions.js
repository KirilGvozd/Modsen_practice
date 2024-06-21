// Напишите функцию, которая генерирует идентификатор строки (указанной длины) из случайных символов

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}

console.log(generateRandomString(30));
console.log(generateRandomString(15));