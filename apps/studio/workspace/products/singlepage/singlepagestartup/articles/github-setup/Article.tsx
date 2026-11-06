import {
  EditorialArticle,
  PromptBlock,
  ProcessDiagram,
} from "../../../../../utils/components/EditorialArticle";

export default function Article() {
  return (
    <EditorialArticle
      title="GitHub для первого проекта: регистрация и копия SinglePageStartup"
      topic="Подготовка к работе с ИИ-агентом"
    >
      <p>
        Чтобы агент мог собрать магазин на SinglePageStartup, ему нужна папка с
        кодом на вашем компьютере. Получим её через GitHub: создадим аккаунт,
        собственный репозиторий и скачаем проект с помощью GitHub Desktop.
      </p>
      <h2>Что здесь делает GitHub</h2>
      <p>
        GitHub — сервис для хранения кода и совместной работы с ним. Репозиторий
        — проект с файлами и историей изменений. GitHub Desktop — программа,
        которая связывает копию на компьютере с репозиторием на сайте. При
        клонировании вы скачиваете проект в выбранную папку.
      </p>
      <ProcessDiagram
        steps={[
          { title: "Аккаунт", detail: "Ваш вход на GitHub." },
          {
            title: "Свой репозиторий",
            detail: "Копия шаблона SPS для магазина.",
          },
          {
            title: "Папка на компьютере",
            detail: "Код доступен для изменения и запуска.",
          },
          {
            title: "ИИ-агент",
            detail: "Работает в этой папке и помогает собрать сайт.",
          },
        ]}
      />
      <h2>1. Создайте аккаунт</h2>
      <p>
        Откройте <a href="https://github.com/signup">регистрацию GitHub</a>,
        пройдите шаги сервиса и подтвердите электронную почту. Подробности есть
        в
        <a href="https://docs.github.com/en/account-and-profile/how-tos/account-management/creating-an-account-on-github">
          {" "}
          официальной инструкции
        </a>
        . Сохраните свой логин: он будет указан владельцем репозитория.
      </p>
      <h2>2. Создайте свою копию SinglePageStartup</h2>
      <p>
        Откройте{" "}
        <a href="https://github.com/singlepagestartup/singlepagestartup">
          шаблон SinglePageStartup
        </a>
        . Нажмите Use this template, затем Create a new repository. В поле
        владельца выберите свой аккаунт, а в названии укажите, например,
        ceramics-shop. Для закрытого проекта выберите Private.
      </p>
      <p>
        После создания в адресе репозитория будут ваш логин и название магазина.
        Это собственный проект, в котором можно менять товары, оформление и
        функции. Официальное описание этого способа —{" "}
        <a href="https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template">
          создание проекта из шаблона
        </a>
        .
      </p>
      <h2>3. Скачайте проект через GitHub Desktop</h2>
      <p>
        Установите <a href="https://desktop.github.com/">GitHub Desktop</a> с
        официального сайта и войдите в свой аккаунт. Выберите File → Clone
        repository, найдите свой ceramics-shop и укажите папку на компьютере.
        После клонирования в ней появятся README.md, AGENTS.md, package.json,
        папки apps и libs.
      </p>
      <p>
        GitHub Desktop выполняет загрузку и отправку изменений. npm и Docker
        понадобятся уже для запуска сайта.{" "}
        <a href="https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-and-forking-repositories-from-github-desktop">
          Инструкция GitHub Desktop
        </a>{" "}
        поможет, если нужного репозитория нет в списке.
      </p>
      <h2>4. Откройте эту папку в агенте</h2>
      <p>
        Откройте папку ceramics-shop в своём ИИ-агенте. У него должен быть
        доступ к файлам именно этой копии. Начните с проверки:
      </p>
      <PromptBlock>
        <p>
          Проверь, что открыта моя копия SinglePageStartup. Прочитай AGENTS.md и
          README.md, покажи название репозитория и объясни, какие команды нужны
          для запуска. Пока не меняй файлы и не отправляй изменения на GitHub.
        </p>
      </PromptBlock>
      <h2>Как сохранять дальнейшую работу</h2>
      <p>
        Когда агент закончит изменение и вы проверите сайт, GitHub Desktop
        покажет изменённые файлы. Commit сохраняет версию в локальной истории,
        Push отправляет её на GitHub, а Pull получает новые версии на компьютер.
        Пароли, платёжные ключи и настройки с секретами должны оставаться вне
        отправляемых файлов.
      </p>
      <p>
        Теперь у вас есть исходный проект на компьютере. Продолжайте по
        <a
          target="_top"
          href="/?path=/story/workspace-50-materials-singlepage-singlepagestartup-articles--articles-ai-online-store"
        >
          {" "}
          инструкции создания интернет-магазина
        </a>
        : зависимости, запуск, каталог, оплата и уведомления владельцу.
      </p>
    </EditorialArticle>
  );
}
