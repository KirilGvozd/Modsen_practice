// Создайте класс Book со свойствами названия, автора и года публикации. Включите метод отображения сведений о книге.
// Создайте подкласс под названием «Ebook»,
// который наследуется от класса «Book» и включает дополнительное свойство для цены книги.
// Переопределите метод отображения, чтобы включить цену книги.
// Создайте экземпляр класса «Электронная книга» и отобразите его сведения.

class Book {
    constructor(name, author, yearOfPublication) {
        this.name = name;
        this.author = author;
        this.yearOfPublication = yearOfPublication;
    }

    printInformation() {
        return `Name: ${this.name}\nAuthor: ${this.author}\nYear of publication: ${this.yearOfPublication}`;
    }
}

class Ebook extends Book {
    constructor(name, author, yearOfPublication, price) {
        super(name, author, yearOfPublication);
        this.price = price;
    }

    printInformation() {
        return super.printInformation() + `\nPrice: ${this.price}`;
    }
}

const ebook = new Ebook('War And Peace', 'Leo Tolstoy', 1865, 20);
console.log(ebook.printInformation());