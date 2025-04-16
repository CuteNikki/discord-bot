import fs from 'fs';
import path from 'path';

export function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

export function getEventFiles() {
  const eventPath = path.join(process.cwd(), 'src/events');
  const eventFiles = getAllFiles(eventPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  return { eventPath, eventFiles };
}

export function getButtonFiles() {
  const buttonPath = path.join(process.cwd(), 'src/interactions/buttons');
  const buttonFiles = getAllFiles(buttonPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  return { buttonPath, buttonFiles };
}

export function getCommandFiles() {
  const cmdPath = path.join(process.cwd(), 'src/interactions/commands');
  const cmdFiles = getAllFiles(cmdPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  return { cmdPath, cmdFiles };
}

export function getModalFiles() {
  const modalPath = path.join(process.cwd(), 'src/interactions/modals');
  const modalFiles = getAllFiles(modalPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  return { modalPath, modalFiles };
}

export function getSelectFiles() {
  const selectPath = path.join(process.cwd(), 'src/interactions/selects');
  const selectFiles = getAllFiles(selectPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  return { selectPath, selectFiles };
}
