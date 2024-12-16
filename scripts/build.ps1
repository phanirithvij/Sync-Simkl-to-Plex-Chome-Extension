Set-PSDebug -Trace 1

Remove-Item -Recurse -Force -ErrorAction SilentlyContinue dist
Copy-Item -Recurse src -Destination dist

if (-Not (Get-Command minify -errorAction SilentlyContinue)) {
    Set-PSDebug -Trace 0
    Invoke-RestMethod -Uri https://github.com/tdewolff/minify/releases/download/v2.21.2/minify_windows_amd64.zip -OutFile .\minify.zip
    Expand-Archive .\minify.zip -DestinationPath .
    Set-PSDebug -Trace 1
}

$content = (Get-Content -Path dist\js\common.js)
# multiline regex with (?ms) or whatnot is not working at all
# so split them to two replaces one per match
# can't comment between ` escaped lines
$content `
    -replace 'const DEVELOPMENT_FETCH_REQS=(true|false)', '' | `
    Out-File -Encoding utf8 -FilePath dist\js\common.js
    # -replace 'DEVELOPMENT=true', 'DEVELOPMENT=false' `
    # -replace 'const devLoggerSetup=\(.*', 'const devloggerSetup=_=>_=>{};' `
    # -replace 'return Function.prototype.bind.*;};$', '' | `

# prevent tests from bundling
Remove-Item -Recurse -ErrorAction SilentlyContinue dist\tests
Remove-Item -ErrorAction SilentlyContinue dist\js\vendor\quint-2.23.1.js
Remove-Item -ErrorAction SilentlyContinue dist\css\vendor\quint-2.18.2-dark.css

if (-Not (Test-Path dist\js\background\env.js) ) {
    $content = @"
const SimklClientID = ``$env:SIMKL_CLIENT_ID``.trim();
const SimklClientSecret = ``$env:SIMKL_CLIENT_SECRET``.trim();
"@
    $content | Out-File -Encoding utf8 -FilePath dist\js\background\env.js
}

.\minify.exe -r -o dist/ src

# validate generated js files for syntax
Set-PSDebug -Trace 0

$env:NO_COLOR = 1
Get-ChildItem -Path dist -Filter *.js -Recurse | Foreach-Object {
    Write-Host "node -c $($_.FullName)"
    # (Get-Content $_.FullName) `
    #     -replace "consoledebug\([^;]*\)\(\);", ";" `
    #     -replace "console.debug\([^;]*\);", ";" | `
    #     Out-File -Encoding utf8 -FilePath $_.FullName
    .\minify.exe -o $_.FullName $_.FullName
    node -c $_.FullName
    if (-Not $?) {
        exit $?
    }
}

Set-PSDebug -Trace 0
