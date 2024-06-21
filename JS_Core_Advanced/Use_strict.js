// Напишите функцию, которая принимает массив и возвращает true, если в массиве есть дубликаты, и false, если нет.
// Используйте строгий режим.

"use strict";

function hasDuplicates(arr) {
    let seen = new Set();
    for (let i = 0; i < arr.length; i++) {
        if (seen.has(arr[i])) {
            return true;
        }
        seen.add(arr[i]);
    }
    return false;
}

console.log(hasDuplicates([1,2,3,4,5,4,7,8,9,10]));
console.log(hasDuplicates([1,2,3,4,5,6,7,8,9,10]));