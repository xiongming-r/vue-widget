#!/usr/bin/env node
import inquirer from 'inquirer'
import download from 'download-git-repo';
import fs from 'fs'
import path from 'path';
import replace from 'replace-in-file';
import { sync as rimraf } from 'rimraf';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import figlet from 'figlet';
import config from '../config.json' assert {type: 'json'};
import ora from 'ora';
// const inquirer = require('inquirer');
// const download = require('download-git-repo');
// const fs = require('fs-extra');
// const path = require('path');
// const replace = require('replace-in-file');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
//定位模板目录
// const templateDir = path.join(process.cwd(), 'login-templates', templateName);
async function init() {
    console.log(chalk.yellow(figlet.textSync('欢迎使用bm-vue3-cli', { horizontalLayout: 'full' })));
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'projectName',
            message: '项目名称:',
            validate: input => {
                if (!input) {
                    return '项目名称不能为空';
                }
                // 检查当前目录下是否已存在同名文件夹
                const projectPath = path.join(process.cwd(), input);
                if (fs.existsSync(projectPath)) {
                    return `已存在名为 "${input}" 的文件夹，请使用其他名称。`;
                }
                return true;
            }
        },
        {
            type: 'password',
            name: 'gitToken',
            message: '密码',
            validate: input => {
                if (input) {
                    if (input === 'bmsoft') {
                        return true
                    } else {
                        return "gitToken错误"
                    }
                } else {
                    return "gitToken不能为空"
                }
            }
        },
        {
            type: 'input',
            name: 'loginTemplates',
            message: '登录页模板:',
            validate: input => {
                if (input.toLowerCase() === "default") return true
                if (input.toLowerCase() === "") return true
                const templateDir = path.join(__dirname, config.templateDir);
                const templatePath = path.join(templateDir, input);
                if (!fs.existsSync(templatePath) || !fs.statSync(templatePath).isDirectory()) {
                    return "没有找到对应的模板";
                } else {
                    return true
                }
            }
        },
    ]);
    console.log('answers:', answers); // 调试输出
    console.log('Project Name:', answers.projectName); // 调试输出

    const projectPath = path.join(process.cwd(), answers.projectName);

    // GitHub 仓库地址，例如 "username/repository"
    const gitRepo = `direct:https://git.dev.bmsoft.top/xiongming/vue3-template.git#template`;

    try {
        // console.log(`Downloading template from ${gitRepo}...`);
        const spinner = ora('模板下载中...').start();
        // 下载模板
        await new Promise((resolve, reject) => {
            download(gitRepo, projectPath, { clone: true }, err => {
                if (err) {
                    reject(err);

                } else {
                    resolve();
                }
            });
        });

        console.log('Template downloaded.');
        spinner.succeed('下载完成~');
        removeGitDir(projectPath)
        // 替换模板中的项目名称
        const replace = ora('替换名称中...').start();
        await replaceProjectName(projectPath, answers.projectName);
        replace.succeed('替换完成~');
        //复制login模板到项目中
        if (answers.loginTemplates.toLowerCase() !== 'default' || answers.loginTemplates.toLowerCase() !== '') {
            const template = ora('复制模板中...').start();
            await chooseTemplate(answers.loginTemplates, path.join(projectPath));
            template.succeed('复制完成~');
        }
        console.log('Project initialized successfully.');

    } catch (error) {
        console.error('Error creating project:', error);
    }
}
async function replaceProjectName(projectPath, projectName) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    console.log(`Checking if package.json exists at ${packageJsonPath}`);

    try {
        // 读取 package.json 文件
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        // 替换项目名称
        const modifiedContent = packageJsonContent.replace(/{{projectName}}/g, projectName);
        // 写回修改后的内容
        fs.writeFileSync(packageJsonPath, modifiedContent, 'utf8');
    } catch (error) {
        console.error('Error replacing project name:', error);
        throw error; // 重新抛出错误供调用者处理
    }
}

// async function replaceProjectName(projectPath, projectName) {
//     const packageJsonPath = path.join(projectPath, 'package.json');
//     console.log(`Checking if package.json exists at ${packageJsonPath}`);
//     if (!fs.existsSync(packageJsonPath)) {
//         console.error('package.json not found!');
//         // return;
//     }
//     const options = {
//         files: path.join(projectPath, 'package.json'),
//         from: /{{projectName}}/g,
//         to: projectName,
//     };

//     try {
//         await replace(options);
//     } catch (error) {
//         console.error('Error replacing project name:', error);
//     }
// }
/**
 * 选择模板
 * @param {*} templateName 用户选择的模板名称 - 基于文件名称
 * @param {*} destination 文件应该被复制到的目标路径
 */
async function chooseTemplate(templateName, destination) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    //定位模板目录
    // const templateDir = path.join(process.cwd(), 'login-templates', templateName);
    const templateDir = path.join(__dirname, config.templateDir, templateName);
    // //读取模板文件
    // const files = fs.readdirSync(templateDir);
    // //复制每个文件
    // files.forEach(file => {
    //     const srcPath = path.join(templateDir, file);
    //     const destPath = path.join(destination, file);
    //     fs.copyFileSync(srcPath, destPath);
    // });
    copyRecursiveSync(templateDir, destination)

}
async function removeGitDir(projectPath) {
    // return new Promise((resolve, reject) => {
    //     rimraf(path.join(projectPath, '.git'), error => {
    //         if (error) {
    //             reject(error);
    //         } else {
    //             resolve();
    //         }
    //     });
    // });
    try {
        rimraf(path.join(projectPath, '.git'));
    } catch (error) {
        console.error('Error removing .git directory:', error);
        throw error; // 如果需要，可以在这里重新抛出错误
    }
}

/**
 * 递归地复制文件和目录
 * @param {string} srcPath 源路径
 * @param {string} destPath 目标路径
 */
function copyRecursiveSync(srcPath, destPath) {
    // 检查源路径是否存在
    const exists = fs.existsSync(srcPath);
    const stats = exists && fs.statSync(srcPath);
    const isDirectory = exists && stats.isDirectory();

    // 如果源路径是目录
    if (isDirectory) {
        // 如果目标目录不存在，创建它
        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }
        // 遍历源目录中的所有文件/目录
        fs.readdirSync(srcPath).forEach(childItemName => {
            copyRecursiveSync(
                path.join(srcPath, childItemName),
                path.join(destPath, childItemName)
            );
        });
    } else {
        // 如果源路径是文件
        // 检查目标路径是否存在，如果不存在，或者文件内容不同，则复制
        if (!fs.existsSync(destPath) || !filesAreIdentical(srcPath, destPath)) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
/**
 * 检查两个文件是否完全相同
 * @param {string} filePath1 第一个文件路径
 * @param {string} filePath2 第二个文件路径
 * @returns {boolean} 文件是否相同
 */
function filesAreIdentical(filePath1, filePath2) {
    const file1Content = fs.readFileSync(filePath1);
    const file2Content = fs.readFileSync(filePath2);
    return file1Content.equals(file2Content);
}

init();
