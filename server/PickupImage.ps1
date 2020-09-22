param (
    [string]$initialFolder = ''
)

if ($initialFolder -eq '') {
    $initialFolder = (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path
}

Add-Type -AssemblyName System.Windows.Forms

$imgPicker = New-Object System.Windows.Forms.OpenFileDialog
$imgPicker.Title = "Select a image file for the book"
$imgPicker.InitialDirectory = $initialFolder
$imgPicker.Filter = 'Images files (*.jpg;*.jpeg;*.png)|*.jpg;*.jpeg;*.png'

$topForm = New-Object System.Windows.Forms.Form -property @{TopMost = $True}
$result = $imgPicker.ShowDialog($topForm)

if($result -eq "OK")    {    
    Write-Host $imgPicker.filename   
} 
else { 
    Write-Host ""
} 