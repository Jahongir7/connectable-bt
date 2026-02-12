import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, UserPlus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useBankStore } from '@/store/bankStore';
import { Client } from '@/types/bank';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const clientSchema = z.object({
  full_name: z.string().min(3, "F.I.O. kamida 3 ta belgidan iborat bo'lishi kerak"),
  phone: z.string().min(9, "Telefon raqami noto'g'ri"),
  passport_series_number: z.string().min(9, "Pasport seriyasi va raqami noto'g'ri (masalan: AA1234567)"),
  birth_date: z.string().optional(),
  passport_issued_date: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  onClose: () => void;
  onClientCreated?: (client: Client) => void;
}

export function ClientForm({ onClose, onClientCreated }: ClientFormProps) {
  const { currentUser, addClient } = useBankStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      passport_series_number: '',
      birth_date: '',
      passport_issued_date: '',
      address: '',
      notes: '',
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('https://mamun.university/api/v1/bt/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: values.full_name.trim(),
          phone: values.phone.trim(),
          passport_series_number: values.passport_series_number.trim().toUpperCase(),
          birth_date: values.birth_date,
          passport_issued_date: values.passport_issued_date,
          address: values.address?.trim(),
          notes: values.notes?.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Mijozni saqlashda xatolik yuz berdi');
      }

      const result = await response.json();

      const client: Client = {
        client_id: result.client_id || `CLT-${Date.now()}`,
        full_name: values.full_name.trim(),
        phone: values.phone.trim(),
        passport_series_number: values.passport_series_number.trim().toUpperCase(),
        birth_date: values.birth_date || undefined,
        passport_issued_date: values.passport_issued_date || undefined,
        address: values.address?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        created_at: new Date(),
        created_by: currentUser?.id || 'system',
      };

      addClient(client);
      toast.success("Mijoz muvaffaqiyatli qo'shildi");

      if (onClientCreated) {
        onClientCreated(client);
      }
      onClose();
    } catch (error) {
      console.error('API Error:', error);
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Yangi mijoz qo'shish</h2>
              <p className="text-sm text-muted-foreground">Mijozning shaxsiy va pasport ma'lumotlarini kiriting</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form Content */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-sm font-semibold">F.I.O. <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Alisher Valiyev" {...field} className="h-11 transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Telefon <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="+998901234567" {...field} className="h-11 transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Passport */}
              <FormField
                control={form.control}
                name="passport_series_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Pasport seriya va raqami <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="AA1234567" {...field} className="h-11 transition-all focus:ring-2 focus:ring-primary/20 uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Birth Date */}
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Tug'ilgan sana</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-11 transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Passport Issued Date */}
              <FormField
                control={form.control}
                name="passport_issued_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Pasport berilgan sana</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-11 transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-sm font-semibold">Manzil</FormLabel>
                    <FormControl>
                      <Input placeholder="Toshkent shahar, Yunusobod tumani" {...field} className="h-11 transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-sm font-semibold">Izoh</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Qo'shimcha ma'lumotlar..." 
                        {...field} 
                        className="min-h-[100px] resize-none transition-all focus:ring-2 focus:ring-primary/20" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 h-12 text-base font-semibold rounded-xl transition-all hover:bg-muted"
                disabled={isSubmitting}
              >
                Bekor qilish
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saqlanmoqda...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Mijozni saqlash
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
