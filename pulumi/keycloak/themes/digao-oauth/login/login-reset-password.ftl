<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('username'); section>
    
    <#if section = "header">
        <#-- Deixamos vazio -->
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
                    
                    <h1 class="digao-title">Recuperar Acesso</h1>
                    <p class="digao-subtitle">Informe seu e-mail para receber o link</p>

                    <#-- Mensagem de erro/sucesso -->
                    <#if message?has_content && (message.type = "error" || message.type = "warning")>
                         <div class="digao-alert">${kcSanitize(message.summary)?no_esc}</div>
                    </#if>

                    <form id="kc-reset-password-form" action="${url.loginAction}" method="post">
                        
                        <label class="digao-label" for="username">E-mail ou Usuário</label>
                        <input type="text" id="username" name="username" class="digao-input" autofocus value="${(auth.attemptedUsername!'')}" aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"/>

                        <#if messagesPerField.existsError('username')>
                            <span class="digao-alert" style="display:block; margin-top:5px; border:none; background:none; padding:0;">
                                ${kcSanitize(messagesPerField.get('username'))?no_esc}
                            </span>
                        </#if>
                        
                        <button class="digao-btn" type="submit">Enviar link</button>

                        <div style="margin-top: 18px; text-align: center;">
                            <a class="digao-link" href="${url.loginUrl}">Voltar para o Login</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    <#elseif section = "info">
        <#-- Removemos info extra -->
    </#if>
</@layout.registrationLayout>
