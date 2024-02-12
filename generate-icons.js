import fs from 'fs';
import path from 'path';

const ICONS = [];

async function readIcons(directory, prefix = '') {
  const files = await fs.promises.readdir(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const fileStat = await fs.promises.stat(filePath);

    if (fileStat.isDirectory()) {
      const newPrefix = prefix === '' ? file : `${prefix}-${file}`;
      await readIcons(filePath, newPrefix);
    } else if (file.endsWith('.svg')) {
      const iconName = prefix === '' ? file.replace('.svg', '') : `${prefix}-${file.replace('.svg', '')}`;
      ICONS.push({ name: iconName, lastModified: fileStat.mtime });
    }
  }
}

const currentFileUrl = import.meta.url;
const currentDirectory = path.dirname(new URL(currentFileUrl).pathname).replace(/^\/[a-z]:/i, '');  

const iconsDirectory = path.join(currentDirectory, 'assets/icons');

(async () => {
  try {
    await readIcons(iconsDirectory);

    // Сортировка по алфавиту
    const alphabeticallySortedIcons = [...ICONS].sort((a, b) => a.name.localeCompare(b.name));
    
    // Сортировка по дате последнего изменения
    const dateSortedIcons = [...ICONS].sort((a, b) => b.lastModified - a.lastModified);

    const targetFilePath = path.join(currentDirectory, 'icons.js');

    try {
      await fs.promises.stat(targetFilePath);

      console.log('Файл icons.js уже существует');
    } catch (statError) {
      const content = `
        // Массив иконок отсортированный по алфавиту
        export const ALPHABETIC_ICONS = ${JSON.stringify(alphabeticallySortedIcons.map(icon => icon.name))};

        // Массив иконок отсортированный по дате последнего изменения файла
        export const DATE_SORTED_ICONS = ${JSON.stringify(dateSortedIcons.map(icon => icon.name))};
      `;

      await fs.promises.writeFile(targetFilePath, content);
      console.log('Файл icons.js успешно сгенерирован с учетом сортировки.');
    }
  } catch (error) {
    console.error('Произошла ошибка:', error);
  }
})();
