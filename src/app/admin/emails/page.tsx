import { getEmailTemplates } from '@/app/actions';
import EmailsClient from './EmailsClient';

export default async function EmailsPage() {
    const templates = await getEmailTemplates();

    return (
        <EmailsClient initialTemplates={templates} />
    );
}
