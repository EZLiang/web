Add-Type -AssemblyName System.Windows.Forms

$downloadsPath = (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path

$imgPicker = New-Object System.Windows.Forms.OpenFileDialog
    #Title = "Select a image file for the book"
    #InitialDirectory = $downloadsPath
#    Filter = 'Images (*.jpg)|*.jpeg|*.png'


$result = [void]$imgPicker.ShowDialog()
$imgPicker.FileNames

if($result -eq "OK")    {    
    Write-Host "Selected Downloaded Settings File:"  -ForegroundColor Green  
    $OpenFileDialog.filename   
    # $OpenFileDialog.CheckFileExists 
        
    # Import-AzurePublishSettingsFile -PublishSettingsFile $openFileDialog.filename  
    # Unremark the above line if you actually want to perform an import of a publish settings file  
    Write-Host "Import Settings File Imported!" -ForegroundColor Green 
} 
else { 
    Write-Host "Import Settings File Cancelled!" -ForegroundColor Yellow
} 