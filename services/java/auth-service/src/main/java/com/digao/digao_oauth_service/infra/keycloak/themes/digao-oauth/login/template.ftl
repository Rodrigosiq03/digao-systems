<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <title>Login | Digao OAuth</title>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <#-- FAVICONS -->
    <#-- Ícone antigo (fallback) -->
    <link rel="shortcut icon" href="${url.resourcesPath}/img/favicon.ico" type="image/x-icon">
    
    <#-- Apple (iPhone/iPad) -->
    <link rel="apple-touch-icon" sizes="180x180" href="${url.resourcesPath}/img/apple-touch-icon.png">
    
    <#-- Navegadores Modernos (Chrome/Firefox/Edge) -->
    <link rel="icon" type="image/png" sizes="32x32" href="${url.resourcesPath}/img/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="${url.resourcesPath}/img/favicon-16x16.png">

    <#-- Android High Res (substituindo o manifest por link direto) -->
    <link rel="icon" type="image/png" sizes="192x192" href="${url.resourcesPath}/img/android-chrome-192x192.png">

    <#-- FONTE -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">

    <#-- titulo -->

    <#-- CSS -->
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
</head>

<body>
    <#-- Aqui chamamos o conteúdo do login.ftl -->
    
    <#-- Renderiza o Título (se necessário, mas estamos controlando isso no form) -->
    <#nested "header">
    
    <#-- Renderiza o Formulário Principal -->
    <#nested "form">
    
    <#-- Renderiza Infos extras (se houver) -->
    <#nested "info">

    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
</body>
</html>
</#macro>