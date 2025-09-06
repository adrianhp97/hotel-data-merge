import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodError, ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        const issues: ZodError['issues'] = err.issues;

        throw new BadRequestException({
          message: 'Validation failed',
          errors: issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      throw err;
    }
  }
}
