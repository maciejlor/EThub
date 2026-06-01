const fs = require('fs');
const path = require('path');

const file = 'c:\\Users\\Macik\\Downloads\\EThub\\src\\pages\\SettingsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Import useLanguage
if (!content.includes("import { useLanguage } from '@/components/LanguageProvider'")) {
    content = content.replace("import { useState } from 'react';", "import { useState } from 'react';\nimport { useLanguage } from '@/components/LanguageProvider';");
}

// Add const { t } = useLanguage(); inside SettingsPage
if (!content.includes("const { t } = useLanguage();")) {
    content = content.replace("export function SettingsPage() {\n  const navigate = useNavigate();", "export function SettingsPage() {\n  const { t } = useLanguage();\n  const navigate = useNavigate();");
}

// Map of replacements
const replacements = [
    [">Settings<", ">{t('Settings')}<"],
    [">Manage your profile, connections, and preferences.<", ">{t('Manage your profile, connections, and preferences.')}<"],
    [">Authentication Required<", ">{t('Authentication Required')}<"],
    [">Please log in to access your settings.<", ">{t('Please log in to access your settings.')}<"],
    [">Log In / Create Test User<", ">{t('Log In / Create Test User')}<"],
    [">Profile Information<", ">{t('Profile Information')}<"],
    [">Profile Banner<", ">{t('Profile Banner')}<"],
    [">Upload an image or enter a banner URL.<", ">{t('Upload an image or enter a banner URL.')}<"],
    [">Update Banner<", ">{t('Update Banner')}<"],
    [">Username<", ">{t('Username')}<"],
    [">Edit<", ">{t('Edit')}<"],
    [">Profile Settings<", ">{t('Profile Settings')}<"],
    [">Display Name / Username<", ">{t('Display Name / Username')}<"],
    ["placeholder='Enter custom username'", "placeholder={t('Enter custom username')}"],
    [">This name will be shown on the dashboard and your menu.<", ">{t('This name will be shown on the dashboard and your menu.')}<"],
    [">Update Username<", ">{t('Update Username')}<"],
    [">Cancel<", ">{t('Cancel')}<"],
    [">Connected Accounts<", ">{t('Connected Accounts')}<"],
    [">Discord<", ">{t('Discord')}<"],
    ["`Connected as ${user.discordUsername}`", "t('Connected as {username}', { username: user.discordUsername })"],
    [">Sign into EThub using your Discord account<", ">{t('Sign into EThub using your Discord account')}<"],
    [">Disconnect<", ">{t('Disconnect')}<"],
    [">Connect Discord<", ">{t('Connect Discord')}<"],
    [">Steam<", ">{t('Steam')}<"],
    [">Sign into EThub using your Steam account<", ">{t('Sign into EThub using your Steam account')}<"],
    [">Connect Steam<", ">{t('Connect Steam')}<"],
    [">Trucky ID<", ">{t('Trucky ID')}<"],
    [">Enter your Trucky ID for accurate job tracking<", ">{t('Enter your Trucky ID for accurate job tracking')}<"],
    [">Add<", ">{t('Add')}<"],
    [">Your Trucky ID<", ">{t('Your Trucky ID')}<"],
    ["placeholder='Enter your Trucky driver ID'", "placeholder={t('Enter your Trucky driver ID')}"],
    [">Enter your Trucky ID to accurately match your jobs from the Trucky API. This ensures your profile shows only your actual completed jobs.<", ">{t('Enter your Trucky ID to accurately match your jobs from the Trucky API. This ensures your profile shows only your actual completed jobs.')}<"],
    [">Save<", ">{t('Save')}<"],
    [">Update Avatar<", ">{t('Update Avatar')}<"],
    [">Use Discord Avatar<", ">{t('Use Discord Avatar')}<"],
    [">Use Steam Avatar<", ">{t('Use Steam Avatar')}<"],
    [">Fetching...<", ">{t('Fetching...')}<"],
    [">Avatar URL<", ">{t('Avatar URL')}<"],
    ["placeholder='Enter avatar image URL'", "placeholder={t('Enter avatar image URL')}"],
    [">Pick an avatar source: Discord, Steam, upload a file, or enter an image URL.<", ">{t('Pick an avatar source: Discord, Steam, upload a file, or enter an image URL.')}<"],
    [">Updating...<", ">{t('Updating...')}<"],
    [">Banner URL<", ">{t('Banner URL')}<"],
    ["placeholder='Enter banner image URL'", "placeholder={t('Enter banner image URL')}"],
    [">Upload Banner Image<", ">{t('Upload Banner Image')}<"],
    [">Upload a custom profile banner or point to an image URL. The selected banner will appear on your profile page.<", ">{t('Upload a custom profile banner or point to an image URL. The selected banner will appear on your profile page.')}<"],
    [">Save Banner<", ">{t('Save Banner')}<"]
];

for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
}

fs.writeFileSync(file, content);
console.log('Successfully updated SettingsPage.tsx');
