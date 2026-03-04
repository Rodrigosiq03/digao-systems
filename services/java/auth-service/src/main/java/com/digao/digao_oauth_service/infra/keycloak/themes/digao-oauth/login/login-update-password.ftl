<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
    
    <#if section = "header">
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
                    
                    <h1 class="digao-title">Definir Nova Senha</h1>
                    <p class="digao-subtitle">Crie uma senha forte para sua conta</p>

                    <#if message?has_content && (message.type = "error")>
                         <div class="digao-alert">${kcSanitize(message.summary)?no_esc}</div>
                    </#if>

                    <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">
                        
                        <#-- Nova Senha -->
                        <label class="digao-label" for="password-new">Nova senha</label>
                        <div class="digao-password">
                            <input type="password" id="password-new" name="password-new" class="digao-input digao-input--pwd" autofocus autocomplete="new-password" />
                            <button type="button" class="digao-pwd-toggle">Mostrar</button>
                        </div>

                        <#-- Confirmar Senha -->
                        <label class="digao-label" for="password-confirm">Confirmar senha</label>
                        <div class="digao-password">
                            <input type="password" id="password-confirm" name="password-confirm" class="digao-input digao-input--pwd" autocomplete="new-password" />
                            <button type="button" class="digao-pwd-toggle">Mostrar</button>
                        </div>

                        <div class="digao-row">
                            <#-- Checkbox de logout de outras sessões -->
                            <#if isAppInitiatedAction??>
                                <label class="digao-checkbox">
                                    <input type="checkbox" id="logout-sessions" name="logout-sessions" value="on" checked>
                                    Desconectar de outros dispositivos
                                </label>
                            </#if>
                        </div>

                        <button class="digao-btn" type="submit">Salvar nova senha</button>
                    </form>
                </div>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>
