// Создайте функцию и внутри неё объявите переменные с использованием var, let и const.
// Попробуйте обратиться к этим переменным вне функции. Какие переменные будут видны снаружи функции, а какие нет?

function someFunc() {
    let letVariable = 1;
    var varVariable = 0;
    const constVariable = -1;

    console.log(letVariable);
    console.log(varVariable);
    console.log(constVariable);
}

someFunc();

console.log(letVariable);
console.log(varVariable);
console.log(constVariable);