// Напишите функцию, которая принимает массив в качестве параметра и выдает пользовательскую ошибку, если массив пуст

function arrayChecker(array) {
    if (array.length === 0) {
        throw new Error("Array is empty");
    }

    return array;
}

console.log(arrayChecker([1]));
console.log(arrayChecker([]));