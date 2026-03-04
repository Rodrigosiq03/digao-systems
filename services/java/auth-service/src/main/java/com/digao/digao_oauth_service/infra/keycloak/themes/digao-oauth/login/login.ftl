<#-- infra/keycloak/themes/digao-oauth/login/login.ftl -->
<#import "template.ftl" as layout>

<@layout.registrationLayout displayInfo=false; section>
  <#if section = "title">
    Digão OAuth
  <#elseif section = "header">
    <#-- deixamos vazio: estamos controlando tudo no "form" -->
  <#elseif section = "form">

    <div class="digao-wrap">
      <div class="digao-card">

        <div class="digao-topbar"></div>
        <button class="digao-theme-toggle" type="button" aria-pressed="false" aria-label="Alternar tema">
          <span class="digao-theme-icon" aria-hidden="true">🌙</span>
          <span class="digao-theme-text">Modo escuro</span>
        </button>

        <div class="digao-body">
          <img class="digao-logo" src="${url.resourcesPath}/img/logo.png" alt="Digão OAuth"/>

          <h1 class="digao-title">Digão OAuth</h1>
          <p class="digao-subtitle">Sistema de autenticação unificado</p>

          <#-- Mensagens de erro gerais -->
          <#if message?has_content && (message.type = "error")>
            <div class="digao-alert">${kcSanitize(message.summary)?no_esc}</div>
          </#if>

          <form id="kc-form-login" action="${url.loginAction}" method="post">
            <#-- Username/email -->
            <label class="digao-label" for="username">
              <#if realm.loginWithEmailAllowed>
                Usuário ou e-mail
              <#else>
                Usuário
              </#if>
            </label>

            <input
              class="digao-input"
              id="username"
              name="username"
              type="text"
              value="${(login.username!'')}"
              autocomplete="username"
              autofocus
            />

            <#-- Password -->
            <label class="digao-label" for="password">Senha</label>
            <div class="digao-password">
                <input
                    class="digao-input digao-input--pwd"
                    id="password"
                    name="password"
                    type="password"
                    autocomplete="current-password"
                />
                <button
                    id="digao-toggle-password"
                    class="digao-pwd-toggle"
                    type="button"
                    aria-pressed="false"
                    aria-label="Mostrar senha"
                >
                    Mostrar
                </button>
            </div>

            <#assign rememberChecked = login.rememberMe?? && (login.rememberMe?string?lower_case == "true" || login.rememberMe?string?lower_case == "on")>

            <div class="digao-row">
              <#if realm.rememberMe>
                <label class="digao-checkbox">
                  <input type="checkbox" id="rememberMe" name="rememberMe"
                    <#if rememberChecked>checked</#if> />
                  Lembrar de mim
                </label>
              <#else>
                <span></span>
              </#if>

              <#if realm.resetPasswordAllowed>
                <a class="digao-link" href="${url.loginResetCredentialsUrl}">
                  Esqueci minha senha
                </a>
              </#if>
            </div>

            <button class="digao-btn" type="submit">
              Entrar
            </button>

            <#-- CSRF (Keycloak usa isso em alguns fluxos) -->
            <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth?has_content && auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
          </form>

        </div>
      </div>
    </div>

  </#if>
</@layout.registrationLayout>
